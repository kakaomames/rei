import io.netty.buffer.ByteBuf;
import io.netty.handler.codec.DecoderException;
import io.netty.handler.codec.EncoderException;
import it.unimi.dsi.fastutil.objects.Object2IntMap;
import it.unimi.dsi.fastutil.objects.Object2IntOpenHashMap;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.function.Function;

public class aan<B extends ByteBuf, V, T> implements aao<B, V> {
   private static final int a = -1;
   private final Function<V, ? extends T> b;
   private final List<aan.c<B, V, T>> c;
   private final Object2IntMap<T> d;

   aan(Function<V, ? extends T> $$0, List<aan.c<B, V, T>> $$1, Object2IntMap<T> $$2) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
   }

   public V a(B $$0) {
      int $$1 = xy.a($$0);
      if ($$1 >= 0 && $$1 < this.c.size()) {
         aan.c $$2 = (aan.c)this.c.get($$1);

         try {
            return $$2.a.decode($$0);
         } catch (Exception var5) {
            if (var5 instanceof aan.b) {
               throw var5;
            } else {
               throw new DecoderException("Failed to decode packet '" + String.valueOf($$2.b) + "'", var5);
            }
         }
      } else {
         throw new DecoderException("Received unknown packet id " + $$1);
      }
   }

   public void a(B $$0, V $$1) {
      T $$2 = this.b.apply($$1);
      int $$3 = this.d.getOrDefault($$2, -1);
      if ($$3 == -1) {
         throw new EncoderException("Sending unknown packet '" + String.valueOf($$2) + "'");
      } else {
         xy.a($$0, $$3);
         aan.c $$4 = (aan.c)this.c.get($$3);

         try {
            aao<? super B, V> $$5 = $$4.a;
            $$5.encode($$0, $$1);
         } catch (Exception var7) {
            if (var7 instanceof aan.b) {
               throw var7;
            } else {
               throw new EncoderException("Failed to encode packet '" + String.valueOf($$2) + "'", var7);
            }
         }
      }
   }

   public static <B extends ByteBuf, V, T> aan.a<B, V, T> a(Function<V, ? extends T> $$0) {
      return new aan.a($$0);
   }

   // $FF: synthetic method
   public void encode(final Object param1, final Object param2) {
      this.a((ByteBuf)var1, var2);
   }

   // $FF: synthetic method
   public Object decode(final Object param1) {
      return this.a((ByteBuf)var1);
   }

   static record c<B, V, T>(aao<? super B, ? extends V> a, T b) {
      final aao<? super B, ? extends V> a;
      final T b;

      c(aao<? super B, ? extends V> param1, T param2) {
         this.a = $$0;
         this.b = $$1;
      }

      public aao<? super B, ? extends V> a() {
         return this.a;
      }

      public T b() {
         return this.b;
      }
   }

   public interface b {
   }

   public static class a<B extends ByteBuf, V, T> {
      private final List<aan.c<B, V, T>> a = new ArrayList();
      private final Function<V, ? extends T> b;

      a(Function<V, ? extends T> $$0) {
         this.b = $$0;
      }

      public aan.a<B, V, T> a(T $$0, aao<? super B, ? extends V> $$1) {
         this.a.add(new aan.c($$1, $$0));
         return this;
      }

      public aan<B, V, T> a() {
         Object2IntOpenHashMap<T> $$0 = new Object2IntOpenHashMap();
         $$0.defaultReturnValue(-2);
         Iterator var2 = this.a.iterator();

         aan.c $$1;
         int $$3;
         do {
            if (!var2.hasNext()) {
               return new aan(this.b, List.copyOf(this.a), $$0);
            }

            $$1 = (aan.c)var2.next();
            int $$2 = $$0.size();
            $$3 = $$0.putIfAbsent($$1.b, $$2);
         } while($$3 == -2);

         throw new IllegalStateException("Duplicate registration for type " + String.valueOf($$1.b));
      }
   }
}
