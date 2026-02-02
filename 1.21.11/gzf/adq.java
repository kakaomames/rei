import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import java.util.Collection;
import java.util.List;

public record adq(List<adq.a> b) implements aay<adb> {
   public static final aao<wx, adq> a = aay.a(adq::a, adq::new);
   private static final int c = 2097152;

   private adq(wx $$0) {
      this($$0.a(adq.a::new));
   }

   public adq(List<adq.a> param1) {
      this.b = $$0;
   }

   public static adq a(List<eqq> $$0) {
      return new adq($$0.stream().map(adq.a::new).toList());
   }

   private void a(wx $$0) {
      $$0.a((Collection)this.b, (aaq)(($$0x, $$1) -> {
         $$1.a($$0x);
      }));
   }

   public aba<adq> a() {
      return ahz.o;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public List<adq.a> b() {
      return this.b;
   }

   public static record a(dvu a, byte[] b) {
      public a(eqq $$0) {
         this($$0.f(), new byte[a($$0)]);
         a(new wx(this.d()), $$0);
      }

      public a(wx $$0) {
         this($$0.f(), $$0.a(2097152));
      }

      public a(dvu param1, byte[] param2) {
         this.a = $$0;
         this.b = $$1;
      }

      private static int a(eqq $$0) {
         int $$1 = 0;
         eqr[] var2 = $$0.d();
         int var3 = var2.length;

         for(int var4 = 0; var4 < var3; ++var4) {
            eqr $$2 = var2[var4];
            $$1 += $$2.i().d();
         }

         return $$1;
      }

      public wx a() {
         return new wx(Unpooled.wrappedBuffer(this.b));
      }

      private ByteBuf d() {
         ByteBuf $$0 = Unpooled.wrappedBuffer(this.b);
         $$0.writerIndex(0);
         return $$0;
      }

      public static void a(wx $$0, eqq $$1) {
         eqr[] var2 = $$1.d();
         int var3 = var2.length;

         for(int var4 = 0; var4 < var3; ++var4) {
            eqr $$2 = var2[var4];
            $$2.i().b($$0);
         }

         if ($$0.writerIndex() != $$0.capacity()) {
            int var10002 = $$0.capacity();
            throw new IllegalStateException("Didn't fill biome buffer: expected " + var10002 + " bytes, got " + $$0.writerIndex());
         }
      }

      public void a(wx $$0) {
         $$0.a(this.a);
         $$0.a(this.b);
      }

      public dvu b() {
         return this.a;
      }

      public byte[] c() {
         return this.b;
      }
   }
}
