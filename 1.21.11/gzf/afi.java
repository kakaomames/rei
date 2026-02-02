import io.netty.buffer.ByteBuf;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record afi(int b, UUID c, int d, @Nullable yu e, zb.a f, @Nullable yh g, yl h, yd.a i) implements aay<adb> {
   public static final aao<xq, afi> a = aay.a(afi::a, afi::new);

   private afi(xq $$0) {
      this($$0.l(), $$0.n(), $$0.l(), (yu)$$0.c(yu::a), new zb.a($$0), (yh)wx.a((ByteBuf)$$0, (aap)yj.d), yl.a((wx)$$0), (yd.a)yd.a.a.decode($$0));
   }

   public afi(int param1, UUID param2, int param3, @Nullable yu param4, zb.a param5, @Nullable yh param6, yl param7, yd.a param8) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
      this.f = $$4;
      this.g = $$5;
      this.h = $$6;
      this.i = $$7;
   }

   private void a(xq $$0) {
      $$0.c(this.b);
      $$0.a(this.c);
      $$0.c(this.d);
      $$0.a(this.e, yu::a);
      this.f.a((wx)$$0);
      wx.a((ByteBuf)$$0, (Object)this.g, (aaq)yj.d);
      yl.a($$0, this.h);
      yd.a.a.encode($$0, this.i);
   }

   public aba<afi> a() {
      return ahz.ag;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public boolean c() {
      return true;
   }

   public int b() {
      return this.b;
   }

   public UUID e() {
      return this.c;
   }

   public int f() {
      return this.d;
   }

   @Nullable
   public yu g() {
      return this.e;
   }

   public zb.a h() {
      return this.f;
   }

   @Nullable
   public yh i() {
      return this.g;
   }

   public yl j() {
      return this.h;
   }

   public yd.a k() {
      return this.i;
   }
}
