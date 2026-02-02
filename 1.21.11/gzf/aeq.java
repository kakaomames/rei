import com.google.common.collect.Lists;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import java.util.EnumMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;

public class aeq {
   private static final aao<ByteBuf, Map<euq.a, long[]>> a;
   private static final int b = 2097152;
   private final Map<euq.a, long[]> c;
   private final byte[] d;
   private final List<aeq.a> e;

   public aeq(eqq $$0) {
      this.c = (Map)$$0.e().stream().filter(($$0x) -> {
         return ((euq.a)$$0x.getKey()).b();
      }).collect(Collectors.toMap(Entry::getKey, ($$0x) -> {
         return (long[])((euq)$$0x.getValue()).a().clone();
      }));
      this.d = new byte[a($$0)];
      a(new wx(this.c()), $$0);
      this.e = Lists.newArrayList();
      Iterator var2 = $$0.J().entrySet().iterator();

      while(var2.hasNext()) {
         Entry<is, elb> $$1 = (Entry)var2.next();
         this.e.add(aeq.a.a((elb)$$1.getValue()));
      }

   }

   public aeq(xq $$0, int $$1, int $$2) {
      this.c = (Map)a.decode($$0);
      int $$3 = $$0.l();
      if ($$3 > 2097152) {
         throw new RuntimeException("Chunk Packet trying to allocate too much memory on read.");
      } else {
         this.d = new byte[$$3];
         $$0.b(this.d);
         this.e = (List)aeq.a.b.decode($$0);
      }
   }

   public void a(xq $$0) {
      a.encode($$0, this.c);
      $$0.c(this.d.length);
      $$0.c(this.d);
      aeq.a.b.encode($$0, this.e);
   }

   private static int a(eqq $$0) {
      int $$1 = 0;
      eqr[] var2 = $$0.d();
      int var3 = var2.length;

      for(int var4 = 0; var4 < var3; ++var4) {
         eqr $$2 = var2[var4];
         $$1 += $$2.j();
      }

      return $$1;
   }

   private ByteBuf c() {
      ByteBuf $$0 = Unpooled.wrappedBuffer(this.d);
      $$0.writerIndex(0);
      return $$0;
   }

   public static void a(wx $$0, eqq $$1) {
      eqr[] var2 = $$1.d();
      int var3 = var2.length;

      for(int var4 = 0; var4 < var3; ++var4) {
         eqr $$2 = var2[var4];
         $$2.c($$0);
      }

      if ($$0.writerIndex() != $$0.capacity()) {
         int var10002 = $$0.capacity();
         throw new IllegalStateException("Didn't fill chunk buffer: expected " + var10002 + " bytes, got " + $$0.writerIndex());
      }
   }

   public Consumer<aeq.b> a(int $$0, int $$1) {
      return ($$2) -> {
         this.a($$2, $$0, $$1);
      };
   }

   private void a(aeq.b $$0, int $$1, int $$2) {
      int $$3 = 16 * $$1;
      int $$4 = 16 * $$2;
      is.a $$5 = new is.a();
      Iterator var7 = this.e.iterator();

      while(var7.hasNext()) {
         aeq.a $$6 = (aeq.a)var7.next();
         int $$7 = $$3 + jw.b($$6.c >> 4);
         int $$8 = $$4 + jw.b($$6.c);
         $$5.d($$7, $$6.d, $$8);
         $$0.accept($$5, $$6.e, $$6.f);
      }

   }

   public wx a() {
      return new wx(Unpooled.wrappedBuffer(this.d));
   }

   public Map<euq.a, long[]> b() {
      return this.c;
   }

   static {
      a = aam.a(($$0) -> {
         return new EnumMap(euq.a.class);
      }, euq.a.h, aam.o);
   }

   private static class a {
      public static final aao<xq, aeq.a> a = aao.a(aeq.a::a, aeq.a::new);
      public static final aao<xq, List<aeq.a>> b;
      final int c;
      final int d;
      final eld<?> e;
      @Nullable
      final uz f;

      private a(int $$0, int $$1, eld<?> $$2, @Nullable uz $$3) {
         this.c = $$0;
         this.d = $$1;
         this.e = $$2;
         this.f = $$3;
      }

      private a(xq $$0) {
         this.c = $$0.readByte();
         this.d = $$0.readShort();
         this.e = (eld)aam.a(mj.e).decode($$0);
         this.f = $$0.o();
      }

      private void a(xq $$0) {
         $$0.l(this.c);
         $$0.m(this.d);
         aam.a(mj.e).encode($$0, this.e);
         $$0.a(this.f);
      }

      static aeq.a a(elb $$0) {
         uz $$1 = $$0.a((jf.a)$$0.j().J_());
         is $$2 = $$0.aD_();
         int $$3 = jw.b($$2.u()) << 4 | jw.b($$2.w());
         return new aeq.a($$3, $$2.v(), $$0.s(), $$1.j() ? null : $$1);
      }

      static {
         b = a.a(aam.a());
      }
   }

   @FunctionalInterface
   public interface b {
      void accept(is var1, eld<?> var2, @Nullable uz var3);
   }
}
