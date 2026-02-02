import abd.1;
import abd.2;
import abd.3;
import io.netty.buffer.ByteBuf;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;
import org.jspecify.annotations.Nullable;

public class abd<T extends xk, B extends ByteBuf, C> {
   final wv a;
   final aaz b;
   private final List<abd.a<T, ?, B, C>> c = new ArrayList();
   @Nullable
   private aaw d;

   public abd(wv $$0, aaz $$1) {
      this.a = $$0;
      this.b = $$1;
   }

   public <P extends aay<? super T>> abd<T, B, C> a(aba<P> $$0, aao<? super B, P> $$1) {
      this.c.add(new abd.a($$0, $$1, (aax)null));
      return this;
   }

   public <P extends aay<? super T>> abd<T, B, C> a(aba<P> $$0, aao<? super B, P> $$1, aax<B, P, C> $$2) {
      this.c.add(new abd.a($$0, $$1, $$2));
      return this;
   }

   public <P extends aav<? super T>, D extends aau<? super T>> abd<T, B, C> a(aba<P> $$0, Function<Iterable<aay<? super T>>, P> $$1, D $$2) {
      aao<ByteBuf, D> $$3 = aao.a((Object)$$2);
      aba<D> $$4 = $$2.a();
      this.c.add(new abd.a($$4, $$3, (aax)null));
      this.d = aaw.a($$0, $$1, $$2);
      return this;
   }

   aao<ByteBuf, aay<? super T>> a(Function<ByteBuf, B> $$0, List<abd.a<T, ?, B, C>> $$1, C $$2) {
      abc<ByteBuf, T> $$3 = new abc(this.b);
      Iterator var5 = $$1.iterator();

      while(var5.hasNext()) {
         abd.a<T, ?, B, C> $$4 = (abd.a)var5.next();
         $$4.a($$3, $$0, $$2);
      }

      return $$3.a();
   }

   private static xn.a a(wv $$0, aaz $$1, List<? extends abd.a<?, ?, ?, ?>> $$2) {
      return new 1($$0, $$1, $$2);
   }

   public abe<T, B> a(C $$0) {
      List<abd.a<T, ?, B, C>> $$1 = List.copyOf(this.c);
      aaw $$2 = this.d;
      xn.a $$3 = a(this.a, this.b, $$1);
      return new 2(this, $$1, $$0, $$2, $$3);
   }

   public abf<T, B, C> a() {
      List<abd.a<T, ?, B, C>> $$0 = List.copyOf(this.c);
      aaw $$1 = this.d;
      xn.a $$2 = a(this.a, this.b, $$0);
      return new 3(this, $$0, $$1, $$2);
   }

   private static <L extends xk, B extends ByteBuf> abe<L, B> a(wv $$0, aaz $$1, Consumer<abd<L, B, bhr>> $$2) {
      abd<L, B, bhr> $$3 = new abd($$0, $$1);
      $$2.accept($$3);
      return $$3.a(bhr.a);
   }

   public static <T extends xr, B extends ByteBuf> abe<T, B> a(wv $$0, Consumer<abd<T, B, bhr>> $$1) {
      return a($$0, aaz.a, $$1);
   }

   public static <T extends wr, B extends ByteBuf> abe<T, B> b(wv $$0, Consumer<abd<T, B, bhr>> $$1) {
      return a($$0, aaz.b, $$1);
   }

   private static <L extends xk, B extends ByteBuf, C> abf<L, B, C> b(wv $$0, aaz $$1, Consumer<abd<L, B, C>> $$2) {
      abd<L, B, C> $$3 = new abd($$0, $$1);
      $$2.accept($$3);
      return $$3.a();
   }

   public static <T extends xr, B extends ByteBuf, C> abf<T, B, C> c(wv $$0, Consumer<abd<T, B, C>> $$1) {
      return b($$0, aaz.a, $$1);
   }

   public static <T extends wr, B extends ByteBuf, C> abf<T, B, C> d(wv $$0, Consumer<abd<T, B, C>> $$1) {
      return b($$0, aaz.b, $$1);
   }

   static record a<T extends xk, P extends aay<? super T>, B extends ByteBuf, C>(aba<P> a, aao<? super B, P> b, @Nullable aax<B, P, C> c) {
      final aba<P> a;

      a(aba<P> param1, aao<? super B, P> param2, @Nullable aax<B, P, C> param3) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
      }

      public void a(abc<ByteBuf, T> $$0, Function<ByteBuf, B> $$1, C $$2) {
         aao $$4;
         if (this.c != null) {
            $$4 = this.c.apply(this.b, $$2);
         } else {
            $$4 = this.b;
         }

         aao<ByteBuf, P> $$5 = $$4.b($$1);
         $$0.a(this.a, $$5);
      }

      public aba<P> a() {
         return this.a;
      }

      public aao<? super B, P> b() {
         return this.b;
      }

      @Nullable
      public aax<B, P, C> c() {
         return this.c;
      }
   }

   static record b<L extends xk>(wv a, aaz b, aao<ByteBuf, aay<? super L>> c, @Nullable aaw d) implements xn<L> {
      b(wv param1, aaz param2, aao<ByteBuf, aay<? super L>> param3, @Nullable aaw param4) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
         this.d = $$3;
      }

      public wv a() {
         return this.a;
      }

      public aaz b() {
         return this.b;
      }

      public aao<ByteBuf, aay<? super L>> c() {
         return this.c;
      }

      @Nullable
      public aaw d() {
         return this.d;
      }
   }
}
